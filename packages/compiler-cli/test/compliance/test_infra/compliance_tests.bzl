load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test", "nodejs_binary", "npm_package_bin")
load("//tools:defaults.bzl", "jasmine_node_test", "ts_library")

def _compliance_tests_and_golden(path):
    nodejs_binary(
        name = "_generate_%s" % path,
        testonly = True,
        data = [
            "//packages/compiler-cli/test/compliance/test_infra:_generate_golden_partial_lib",
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
        entry_point = "//packages/compiler-cli/test/compliance/test_infra:cli.ts",
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
        data = [
            "//packages/compiler-cli/test/compliance/test_infra:_generate_golden_partial_lib",
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
    )

    generated_file_test(
        visibility = ["//visibility:public"],
        tags = [
            "ivy-only",
        ],
        name = "%s.golden" % path,
        src = "//packages/compiler-cli/test/compliance/test_cases:%s/golden_partial.js" % path,
        generated = "_generated_%s" % path,
    )

def generate_compliance_test_targets(paths = []):
    jasmine_node_test(
        name = "full_test",
        bootstrap = ["//tools/testing:node_no_angular_es5"],
        data = [
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
        shard_count = 2,
        tags = [
            "ivy-only",
        ],
        deps = [
            "//packages/compiler-cli/test/compliance/test_infra:_full_compile_test_lib",
        ],
    )

    jasmine_node_test(
        name = "linked_test",
        bootstrap = ["//tools/testing:node_no_angular_es5"],
        data = [
            "//packages/compiler-cli/test/compliance/test_cases",
            "//packages/compiler-cli/test/ngtsc/fake_core:npm_package",
        ],
        shard_count = 2,
        tags = [
            "ivy-only",
        ],
        deps = [
            "//packages/compiler-cli/test/compliance/test_infra:_linked_compile_test_lib",
        ],
    )



    [_compliance_tests_and_golden(path = path[:-11]) for path in paths]
