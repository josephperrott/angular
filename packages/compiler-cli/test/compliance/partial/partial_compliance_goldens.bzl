load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "nodejs_binary", "npm_package_bin")


def partial_compliance_golden(path):
    """Creates the generate and testing targets for partial compile results.
    """
    # Remove the "tests.json" substring from the end of the provided path.
    path = path[:-11]

    nodejs_binary(
        name = "_generate_%s" % path,
        testonly = True,
        data = [
            "//packages/compiler-cli/test/compliance/partial:generate_golden_partial_lib",
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
        visibility = [":__pkg__"],
        entry_point = "//packages/compiler-cli/test/compliance/partial:cli.ts",
        templated_args = [
            # "--node_options=--inspect-brk",
            path + "/tests.json",
        ],
    )

    npm_package_bin(
        name = "_generated_%s" % path,
        tool = "_generate_%s" % path,
        testonly = True,
        stdout = "%s/this_file_should_not_be_committed" % path,
        link_workspace_root = True,
        visibility = [":__pkg__"],
        data = [
            "//packages/compiler-cli/test/compliance/partial:generate_golden_partial_lib",
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
    )

    generated_file_test(
        visibility = ["//visibility:public"],
        name = "%s.golden" % path,
        src = "//packages/compiler-cli/test/compliance/test_cases:%s/golden_partial.js" % path,
        generated = "_generated_%s" % path,
    )
